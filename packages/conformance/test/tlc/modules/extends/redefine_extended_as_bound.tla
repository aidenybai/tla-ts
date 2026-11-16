(*---
description: "A bound name may not reuse an extended operator's name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [extends]
includes: [FixExtA.tla]
outcome: parse-error
---*)
---- MODULE redefine_extended_as_bound ----
EXTENDS FixExtA
Op == \A Shared \in {1} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 10 to line 10, col 15 of module redefine_extended_as_bound
    | Multiply-defined symbol 'Shared': this definition or declaration conflicts 
    | with the one at line 2, col 1 to line 2, col 11 of module FixExtA.
    3002:1 Parsing or semantic analysis failed.
---*)
