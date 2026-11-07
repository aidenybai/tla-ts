(*---
description: SANY reports E4220. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4220_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a module tries to import a nonexistent spec, it should be an error.
---- MODULE E4220_Test ----
EXTENDS DoesNotExist12345
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file E4220_Test
    | In module E4220_Test
    | Cannot find source file for module DoesNotExist12345 imported in module E4220_Test.
    | *** Errors: 1
    | In module E4220_Test
    | Cannot find source file for module DoesNotExist12345 imported in module E4220_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
