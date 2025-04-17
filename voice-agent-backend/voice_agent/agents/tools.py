from langmem import create_manage_memory_tool, create_search_memory_tool

manage_memory_tool = create_manage_memory_tool(
    namespace=(
        "quick_task_assistant", 
        "{checkpoint_id}",
        "collection"
    )
)
search_memory_tool = create_search_memory_tool(
    namespace=(
        "quick_task_assistant",
        "{checkpoint_id}",
        "collection"
    )
)