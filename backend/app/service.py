import pandas as pd

from app.schemas import GraphLink, GraphNode, GraphResponse, InteractionRow, SummaryResponse
from app.utils import DataFileError, load_csv_dataframe, shorten_employee_id


def _prepare_dataframe() -> pd.DataFrame:
    dataframe = load_csv_dataframe()
    dataframe["employee_id_1"] = dataframe["employee_id_1"].astype(str)
    dataframe["employee_id_2"] = dataframe["employee_id_2"].astype(str)
    dataframe["interaction_type"] = dataframe["interaction_type"].astype(str)
    dataframe["interaction_strength"] = pd.to_numeric(
        dataframe["interaction_strength"], errors="coerce"
    )
    if dataframe["interaction_strength"].isna().any():
        raise DataFileError("CSV file contains non-numeric interaction_strength values.")

    invalid_strengths = dataframe[
        (dataframe["interaction_strength"] < 0) | (dataframe["interaction_strength"] > 100)
    ]
    if not invalid_strengths.empty:
        raise DataFileError("CSV file contains interaction_strength values outside the 0-100 range.")

    return dataframe


def get_summary() -> SummaryResponse:
    dataframe = _prepare_dataframe()
    unique_employees = pd.unique(
        pd.concat([dataframe["employee_id_1"], dataframe["employee_id_2"]], ignore_index=True)
    )
    average_strength = float(dataframe["interaction_strength"].mean()) if not dataframe.empty else 0.0
    interaction_type_counts = {
        key: int(value)
        for key, value in dataframe["interaction_type"].value_counts().sort_index().items()
    }

    return SummaryResponse(
        employees_count=int(len(unique_employees)),
        interactions_count=int(len(dataframe)),
        average_strength=round(average_strength, 2),
        interaction_type_counts=interaction_type_counts,
    )


def get_graph() -> GraphResponse:
    dataframe = _prepare_dataframe()
    unique_employees = pd.unique(
        pd.concat([dataframe["employee_id_1"], dataframe["employee_id_2"]], ignore_index=True)
    )
    nodes = [
        GraphNode(id=employee_id, label=shorten_employee_id(employee_id))
        for employee_id in sorted(unique_employees)
    ]
    links = [
        GraphLink(
            source=row.employee_id_1,
            target=row.employee_id_2,
            interaction_type=row.interaction_type,
            interaction_strength=float(row.interaction_strength),
        )
        for row in dataframe.itertuples(index=False)
    ]

    return GraphResponse(nodes=nodes, links=links)


def get_interactions(
    interaction_type: str | None = None,
    min_strength: float | None = None,
    employee_id: str | None = None,
) -> list[InteractionRow]:
    dataframe = _prepare_dataframe()

    if interaction_type is not None:
        dataframe = dataframe[dataframe["interaction_type"] == interaction_type]

    if min_strength is not None:
        dataframe = dataframe[dataframe["interaction_strength"] >= min_strength]

    if employee_id is not None:
        dataframe = dataframe[
            (dataframe["employee_id_1"] == employee_id)
            | (dataframe["employee_id_2"] == employee_id)
        ]

    return [
        InteractionRow(
            employee_id_1=row.employee_id_1,
            employee_id_2=row.employee_id_2,
            interaction_type=row.interaction_type,
            interaction_strength=float(row.interaction_strength),
        )
        for row in dataframe.itertuples(index=False)
    ]
