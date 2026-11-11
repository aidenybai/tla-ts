(*---
description: SANY reports E4203. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4203_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
INSTANCE operator definitions cannot be referred to by themselves; instead,
operator applications must refer to a specific definition within the imported
module, like import!def.
---- MODULE E4203_Test ----
import == INSTANCE Naturals
op == import
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 7 to line 13, col 12 of module E4203_Test
    | Operator name import is incomplete.
    3002:1 Parsing or semantic analysis failed.
---*)
