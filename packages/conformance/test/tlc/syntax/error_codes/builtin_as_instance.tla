(*---
description: 4202 fires for an instance named TRUE.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_instance ----
---- MODULE I ----
====
TRUE == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 18 of module builtin_as_instance
    | Symbol TRUE is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
