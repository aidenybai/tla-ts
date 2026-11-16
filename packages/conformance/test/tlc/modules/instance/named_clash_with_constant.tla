(*---
description: An instance name may not reuse a constant name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
outcome: parse-error
---*)
---- MODULE named_clash_with_constant ----
---- MODULE I ----
====
CONSTANT M
M == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 15 of module named_clash_with_constant
    | Multiply-defined symbol 'M': this definition or declaration conflicts 
    | with the one at line 10, col 10 to line 10, col 10 of module named_clash_with_constant.
    3002:1 Parsing or semantic analysis failed.
---*)
