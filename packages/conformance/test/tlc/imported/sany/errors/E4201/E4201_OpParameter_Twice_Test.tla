(*---
description: SANY reports E4201. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4201_OpParameter_Twice_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
A symbol cannot be used twice as a parameter to an operator definition.
---- MODULE E4201_OpParameter_Twice_Test ----
op(x, x) == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 7 to line 10, col 7 of module E4201_OpParameter_Twice_Test
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 10, col 4 to line 10, col 4 of module E4201_OpParameter_Twice_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
