(*---
description: SANY reports E4332. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4332_Collision_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Label parameters are required if labels occur within the scope of bound
identifiers, but not identifiers introduced by operators. The correct error
should trigger even if the unnecessary parameter coincidentally matches an
existing definition such as a constant or variable.
---- MODULE E4332_Collision_Test ----
CONSTANT x
op == lbl(x) :: 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 14, col 11 to line 14, col 11 of module E4332_Collision_Test
    | Illegal parameter x of label `lbl'.
    | line 14, col 7 to line 14, col 17 of module E4332_Collision_Test
    | Label lbl declares extra parameter(s)  x  
    3002:1 Parsing or semantic analysis failed.
---*)
