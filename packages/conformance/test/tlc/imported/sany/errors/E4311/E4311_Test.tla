(*---
description: SANY reports E4311. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4311_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Stuttering-sensitive eventually property.
Must be of form <><<A>>_v when <> followed by action-level formula.
---- MODULE E4311_Test ----
VARIABLE v
op == <>(v')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 7 to line 12, col 12 of module E4311_Test
    | <> followed by action not of form <<A>>_v.
    3002:1 Parsing or semantic analysis failed.
---*)
