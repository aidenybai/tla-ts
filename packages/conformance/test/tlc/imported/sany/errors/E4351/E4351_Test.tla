(*---
description: SANY reports E4351. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4351_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
While proof steps that consist of a simple expression can be referenced as
expression using their proof step name (see step <1>c), other non-expression
proof steps cannot be used in that way (see step <1>d).
---- MODULE E4351_Test ----
op(x) == x
THEOREM TRUE
PROOF
<1>a TRUE
<1>b HAVE TRUE
<1>c op(<1>a)
<1>d op(<1>b)
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 18, col 9 to line 18, col 12 of module E4351_Test
    | HAVE proof step selected instead of expression.
    3002:1 Parsing or semantic analysis failed.
---*)
