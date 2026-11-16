(*---
description: SANY reports E4201. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4201_BoundSymbol_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a symbol is already defined, its name cannot be re-used as a bound symbol
in a quantifier.
---- MODULE E4201_BoundSymbol_Test ----
VARIABLE x
op == \A x \in {} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 10 to line 12, col 10 of module E4201_BoundSymbol_Test
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 11, col 10 to line 11, col 10 of module E4201_BoundSymbol_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
