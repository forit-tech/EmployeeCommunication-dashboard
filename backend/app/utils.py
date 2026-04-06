import re
from pathlib import Path
from typing import Any

import pandas as pd

CSV_FILENAME = "employee_communication.csv"
REQUIRED_COLUMNS = [
    "employee_id_1",
    "employee_id_2",
    "interaction_type",
    "interaction_strength",
]
CSV_PATH = Path(__file__).resolve().parents[1] / "data" / CSV_FILENAME
CANONICAL_COLUMN_ALIASES = {
    "employee_id_1": {
        "employee_id_1",
        "employee id 1",
        "id \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430 1",
        "id \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u04301",
        "uuid \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430 1",
        "uuid \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u04301",
    },
    "employee_id_2": {
        "employee_id_2",
        "employee id 2",
        "id \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430 2",
        "id \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u04302",
        "uuid \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430 2",
        "uuid \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u04302",
    },
    "interaction_type": {
        "interaction_type",
        "interaction type",
        "\u0432\u0438\u0434 \u043e\u0431\u043c\u0435\u043d\u0430 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u0435\u0439",
        "\u0442\u0438\u043f \u043e\u0431\u043c\u0435\u043d\u0430 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u0435\u0439",
        "\u0432\u0438\u0434 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f",
        "\u0442\u0438\u043f \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f",
    },
    "interaction_strength": {
        "interaction_strength",
        "interaction strength",
        "\u0441\u0442\u0435\u043f\u0435\u043d\u044c \u043e\u0431\u043c\u0435\u043d\u0430",
        "\u0441\u0442\u0435\u043f\u0435\u043d\u044c \u043e\u0431\u043c\u0435\u043d\u0430 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u0435\u0439",
        "\u0441\u0438\u043b\u0430 \u0432\u0437\u0430\u0438\u043c\u043e\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f",
    },
}


class DataFileError(Exception):
    """Raised when the local CSV file is missing or invalid."""

    def __init__(self, detail: str | dict[str, Any]) -> None:
        self.detail = detail
        super().__init__(
            detail if isinstance(detail, str) else detail.get("message", "Data file error.")
        )


def get_csv_path() -> Path:
    return CSV_PATH


def shorten_employee_id(employee_id: str) -> str:
    return employee_id[:8]


def normalize_column_name(column_name: Any) -> str:
    normalized = str(column_name).replace("\ufeff", "")
    normalized = normalized.strip().lower().replace("_", " ")
    normalized = normalized.replace("\u0451", "\u0435")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def _build_column_mapping(columns: list[str]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    normalized_to_original = {
        normalize_column_name(column_name): column_name for column_name in columns
    }

    for canonical_name, aliases in CANONICAL_COLUMN_ALIASES.items():
        normalized_aliases = {normalize_column_name(alias) for alias in aliases}
        matched_columns = [
            original_name
            for normalized_name, original_name in normalized_to_original.items()
            if normalized_name in normalized_aliases
        ]

        if len(matched_columns) > 1:
            raise DataFileError(
                {
                    "message": "CSV file contains multiple matching columns for a canonical field.",
                    "canonical_column": canonical_name,
                    "matched_columns": matched_columns,
                }
            )

        if matched_columns:
            mapping[matched_columns[0]] = canonical_name

    return mapping


def load_csv_dataframe() -> pd.DataFrame:
    csv_path = get_csv_path()

    if not csv_path.exists():
        raise DataFileError(
            f"CSV file not found: expected {CSV_FILENAME} in backend/data/."
        )

    dataframe = pd.read_csv(csv_path, encoding="utf-8-sig")
    found_columns = [str(column_name) for column_name in dataframe.columns]
    column_mapping = _build_column_mapping(found_columns)
    dataframe = dataframe.rename(columns=column_mapping)

    missing_columns = [
        column_name for column_name in REQUIRED_COLUMNS if column_name not in dataframe.columns
    ]
    if missing_columns:
        raise DataFileError(
            {
                "message": "CSV file is missing required columns.",
                "required_columns": REQUIRED_COLUMNS,
                "found_columns": found_columns,
            }
        )

    return dataframe[REQUIRED_COLUMNS].copy()
