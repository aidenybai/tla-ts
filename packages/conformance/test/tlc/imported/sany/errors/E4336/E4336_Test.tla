(*---
description: SANY reports E4336. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4336_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Label names cannot be duplicated where referring to the label would refer
to an ambiguous expression. Label names *can* be duplicated if they are
nested; for example, lbl :: lbl :: expr is not ambiguous because to address
expression you would use lbl!lbl instead of just lbl.
---- MODULE E4336_Test ----
op == {lbl :: 0, lbl :: 0}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 18 to line 13, col 25 of module E4336_Test
    | Duplicate label `lbl'.
    3002:1 Parsing or semantic analysis failed.
---*)
