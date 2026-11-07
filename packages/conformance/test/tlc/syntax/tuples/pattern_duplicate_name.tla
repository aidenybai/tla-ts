(*---
description: A tuple pattern cannot repeat a name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [tuples]
outcome: parse-error
---*)
---- MODULE pattern_duplicate_name ----
Test == \A <<x, x>> \in {<<1, 2>>} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 17 to line 8, col 17 of module pattern_duplicate_name
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 14 to line 8, col 14 of module pattern_duplicate_name.
    3002:1 Parsing or semantic analysis failed.
---*)
