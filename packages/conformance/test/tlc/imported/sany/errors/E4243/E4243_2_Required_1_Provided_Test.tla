(*---
description: SANY reports E4243. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4243_2_Required_1_Provided_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
When importing a module with INSTANCE, a substitute for a constant operator
must have the correct arity.
---- MODULE E4243_2_Required_1_Provided_Test ----
---- MODULE Inner ----
CONSTANT F(_, _)
====
op(x) == 0
INSTANCE Inner WITH F <- op
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 15, col 26 to line 15, col 27 of module E4243_2_Required_1_Provided_Test
    | Expected arity 2 but found operator of arity 1.
    | In module --TLA+ BUILTINS--
    | An operator must be substituted for symbol 'F', and it must have arity 2.
    3002:1 Parsing or semantic analysis failed.
---*)
