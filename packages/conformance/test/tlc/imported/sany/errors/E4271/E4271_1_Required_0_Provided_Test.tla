(*---
description: SANY reports E4271. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4271_1_Required_0_Provided_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If an operator takes a higher-order operator as a parameter, any operator
passed to it as an argument must have the correct arity.
---- MODULE E4271_1_Required_0_Provided_Test ----
op(F(_)) == 0
op2 == 0
op3 == op(op2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 13, col 11 to line 13, col 13 of module E4271_1_Required_0_Provided_Test
    | Expected arity 1 but found operator of arity 0.
    | line 13, col 8 to line 13, col 14 of module E4271_1_Required_0_Provided_Test
    | Argument number 1 to operator 'op' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
