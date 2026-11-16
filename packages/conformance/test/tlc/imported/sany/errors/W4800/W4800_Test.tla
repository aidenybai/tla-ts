(*---
description: SANY reports W4800. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/W4800_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Same identifier used for same symbol type in extended modules.
Only a warning; definition in module extended first is used.
---- MODULE W4800_Test ----
EXTENDS W4800_Extended, Naturals
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file W4800_Test
    | In module W4800_Test
    | Cannot find source file for module W4800_Extended imported in module W4800_Test.
    | *** Errors: 1
    | In module W4800_Test
    | Cannot find source file for module W4800_Extended imported in module W4800_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
