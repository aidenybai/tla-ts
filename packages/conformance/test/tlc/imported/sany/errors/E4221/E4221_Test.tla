(*---
description: SANY reports E4221. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4221_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If the top-level module in a .tla source file does not match the filename, it
should be an error.
---- MODULE Not_Named_E4221_Test ----
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file E4221_Test
    | Unknown location
    | File name 'E4221_Test' does not match the name 'Not_Named_E4221_Test' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'E4221_Test' does not match the name 'Not_Named_E4221_Test' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)
