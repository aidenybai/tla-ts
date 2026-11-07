(*---
description: EXTENDS of a nested module defined later in the same module is reported as a redefinition of that nested module.
ref: "tla2sany/semantic/SymbolTable.java#addModule"
features: [extends]
outcome: parse-error
---*)
---- MODULE extends_inner_defined_later ----
EXTENDS Later
---- MODULE Later ----
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 10, col 4 of module extends_inner_defined_later
    | Multiply-defined module 'Later': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 2, col 4 of module Later.
    3002:1 Parsing or semantic analysis failed.
---*)
