(*---
description: SANY reports E4355. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4355_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Although TLA+ is nominally untyped, there are certain definition categories
that can be checked for compatibility; here, an ASSUME/PROVE definition is
used where an ordinary expression is required, which is an error. The proof
parts of the language can usually reference the non-proof parts, but rarely
vice-versa.
---- MODULE E4355_Test ----
THEOREM thm == ASSUME TRUE PROVE TRUE
op == thm
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 7 to line 15, col 9 of module E4355_Test
    | ASSUME/PROVE used where an expression is required.
    3002:1 Parsing or semantic analysis failed.
---*)
