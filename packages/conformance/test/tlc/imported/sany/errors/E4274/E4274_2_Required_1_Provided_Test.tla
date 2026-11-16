(*---
description: SANY reports E4274. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4274_2_Required_1_Provided_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
This error is caused by providing a LAMBDA operator of incorrect arity as an
argument to an operator accepting a higher-level operator parameter.
---- MODULE E4274_2_Required_1_Provided_Test ----
op(F(_, _)) == 0
op2 == op(LAMBDA x : 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 12, col 8 to line 12, col 9 of module E4274_2_Required_1_Provided_Test
    | Lambda expression with arity 1 used as argument 1 of operator `op', 
    | but an operator of arity 2 is required.
    | line 12, col 8 to line 12, col 23 of module E4274_2_Required_1_Provided_Test
    | Argument number 1 to operator 'op' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
