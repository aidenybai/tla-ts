(*---
description: SANY reports E4222. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4222_Instance_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a module imports another module, this forms a chain of module dependencies
which cannot contain a cycle.
---- MODULE E4222_Instance_Test ----
INSTANCE E4222_Instanced
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file E4222_Instance_Test
    | In module E4222_Instance_Test
    | Cannot find source file for module E4222_Instanced imported in module E4222_Instance_Test.
    | *** Errors: 1
    | In module E4222_Instance_Test
    | Cannot find source file for module E4222_Instanced imported in module E4222_Instance_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
