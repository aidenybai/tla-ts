(*---
description: Definition After Nested Module. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/modules.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE modules_definition_after_nested_module ----
---- MODULE Inner ----
====
op == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 7 of module modules_definition_after_nested_module
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
