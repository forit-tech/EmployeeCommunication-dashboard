from fastapi import APIRouter, HTTPException, Query

from app.schemas import GraphResponse, HealthResponse, InteractionRow, SummaryResponse
from app.service import get_graph, get_interactions, get_summary
from app.utils import DataFileError

router = APIRouter(tags=["Взаимодействия сотрудников"])


def _handle_data_error(error: DataFileError) -> None:
    raise HTTPException(status_code=500, detail=error.detail) from error


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Проверка доступности API",
    description="Возвращает базовый статус backend-сервиса. Используется для быстрой проверки, что API запущен и отвечает.",
)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get(
    "/summary",
    response_model=SummaryResponse,
    summary="Сводные метрики по взаимодействиям",
    description="Возвращает агрегированные показатели по CSV-файлу: число сотрудников, число взаимодействий, среднюю силу взаимодействия и распределение по типам.",
)
def summary() -> SummaryResponse:
    try:
        return get_summary()
    except DataFileError as error:
        _handle_data_error(error)


@router.get(
    "/graph",
    response_model=GraphResponse,
    summary="Данные для графа связей",
    description="Возвращает список узлов и ребер для визуализации графа связей сотрудников. Узлы представляют сотрудников, а ребра — отдельные взаимодействия между ними.",
)
def graph() -> GraphResponse:
    try:
        return get_graph()
    except DataFileError as error:
        _handle_data_error(error)


@router.get(
    "/interactions",
    response_model=list[InteractionRow],
    summary="Список взаимодействий для таблицы",
    description="Возвращает строки взаимодействий из CSV-файла. Поддерживает фильтрацию по типу взаимодействия, минимальной силе связи и идентификатору сотрудника.",
)
def interactions(
    interaction_type: str | None = Query(
        default=None,
        description="Тип взаимодействия для фильтрации, например задача, звонок или сообщение.",
        examples=["задача"],
    ),
    min_strength: float | None = Query(
        default=None,
        ge=0,
        le=100,
        description="Минимальная сила взаимодействия. Возвращаются только записи с interaction_strength не ниже указанного значения.",
        examples=[50],
    ),
    employee_id: str | None = Query(
        default=None,
        description="Полный UUID сотрудника. В выборку попадут все строки, где этот сотрудник участвует как employee_id_1 или employee_id_2.",
        examples=["b9ad9b6c-2eaa-4b77-a5a5-67810fac8998"],
    ),
) -> list[InteractionRow]:
    try:
        return get_interactions(
            interaction_type=interaction_type,
            min_strength=min_strength,
            employee_id=employee_id,
        )
    except DataFileError as error:
        _handle_data_error(error)
