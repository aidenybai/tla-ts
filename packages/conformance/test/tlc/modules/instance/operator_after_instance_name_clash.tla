(*---
description: An operator may not reuse an instance name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
outcome: parse-error
---*)
---- MODULE operator_after_instance_name_clash ----
---- MODULE I ----
====
M == INSTANCE I
M == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 6 of module operator_after_instance_name_clash
    | Operator M already defined or declared.
    | line 11, col 1 to line 11, col 6 of module operator_after_instance_name_clash
    | Multiply-defined symbol 'M': this definition or declaration conflicts 
    | with the one at line 10, col 1 to line 10, col 15 of module operator_after_instance_name_clash.
    3002:1 Parsing or semantic analysis failed.
---*)
