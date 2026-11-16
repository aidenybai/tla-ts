(*---
description: SANY reports E4245. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4245_Variable_Sub_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
When importing a non-constant module as an INSTANCE and performing
substitutions, each constant & variable must be substituted by a symbol of
the same level. If the imported module is fully constant the levels of the
substitutions do not matter.
---- MODULE E4245_Variable_Sub_Test ----
---- MODULE Inner ----
VARIABLE v1
====
VARIABLE v2
INSTANCE Inner WITH v1 <- v2'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 17, col 1 to line 17, col 29 of module E4245_Variable_Sub_Test
    | Level error in instantiating module 'Inner':
    | The level of the expression or operator substituted for 'v1' 
    | must be at most 1.
    3002:1 Parsing or semantic analysis failed.
---*)
