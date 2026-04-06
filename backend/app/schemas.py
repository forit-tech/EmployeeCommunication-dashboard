from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(
        description="Статус доступности backend API.",
        examples=["ok"],
    )


class SummaryResponse(BaseModel):
    employees_count: int = Field(
        description="Количество уникальных сотрудников, найденных в CSV-файле.",
        examples=[100],
    )
    interactions_count: int = Field(
        description="Общее количество взаимодействий в наборе данных.",
        examples=[1000],
    )
    average_strength: float = Field(
        description="Средняя сила взаимодействия по всем строкам CSV.",
        examples=[48.73],
    )
    interaction_type_counts: dict[str, int] = Field(
        description="Распределение количества взаимодействий по типам.",
        examples=[{"задача": 320, "звонок": 341, "сообщение": 339}],
    )


class GraphNode(BaseModel):
    id: str = Field(
        description="Полный UUID сотрудника.",
        examples=["b9ad9b6c-2eaa-4b77-a5a5-67810fac8998"],
    )
    label: str = Field(
        description="Сокращенный идентификатор сотрудника для компактного отображения в графе.",
        examples=["b9ad9b6c"],
    )


class GraphLink(BaseModel):
    source: str = Field(
        description="UUID сотрудника-источника связи.",
        examples=["b9ad9b6c-2eaa-4b77-a5a5-67810fac8998"],
    )
    target: str = Field(
        description="UUID сотрудника-получателя связи.",
        examples=["d160362f-6beb-4194-a120-7ed3249d629a"],
    )
    interaction_type: str = Field(
        description="Тип взаимодействия из CSV без дополнительного преобразования.",
        examples=["звонок"],
    )
    interaction_strength: float = Field(
        description="Сила взаимодействия в диапазоне от 0 до 100.",
        examples=[39],
    )


class GraphResponse(BaseModel):
    nodes: list[GraphNode] = Field(
        description="Список узлов графа, где каждый узел соответствует сотруднику.",
    )
    links: list[GraphLink] = Field(
        description="Список ребер графа, где каждое ребро соответствует одному взаимодействию между сотрудниками.",
    )


class InteractionRow(BaseModel):
    employee_id_1: str = Field(
        description="UUID первого сотрудника в записи взаимодействия.",
        examples=["b9ad9b6c-2eaa-4b77-a5a5-67810fac8998"],
    )
    employee_id_2: str = Field(
        description="UUID второго сотрудника в записи взаимодействия.",
        examples=["d160362f-6beb-4194-a120-7ed3249d629a"],
    )
    interaction_type: str = Field(
        description="Тип взаимодействия в исходном виде из CSV.",
        examples=["сообщение"],
    )
    interaction_strength: float = Field(
        ge=0,
        le=100,
        description="Сила взаимодействия в диапазоне от 0 до 100.",
        examples=[72],
    )
