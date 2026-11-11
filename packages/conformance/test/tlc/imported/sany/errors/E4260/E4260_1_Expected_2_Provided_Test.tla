(*---
description: SANY reports E4260. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4260_1_Expected_2_Provided_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Similar to an operator, a function has a defined number of parameters and if
the wrong number are provided then that should be an error. Unlike operators
a function does constitute a value in itself so only certain misuses of it
can be statically detected. Another difficulty is that multi-parameter
functions can always be called using a single multi-value tuple argument.
---- MODULE E4260_1_Expected_2_Provided_Test ----
f[x \in {}] == 0
op == f[0, 0]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 7 to line 15, col 13 of module E4260_1_Expected_2_Provided_Test
    | Function 'f' is defined with 1 parameters, but is applied to 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
