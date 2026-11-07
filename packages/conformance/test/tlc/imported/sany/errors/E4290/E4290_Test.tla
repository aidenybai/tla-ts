(*---
description: SANY reports E4290. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4290_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Use of the prime operator inside of recursive operators should be prevented,
as it makes it very easy to double-prime an expression.
---- MODULE E4290_Test ----
RECURSIVE op(_)
op(x) == x'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 11 of module E4290_Test
    | Argument 1 of recursive operator op is primed
    3002:1 Parsing or semantic analysis failed.
---*)
