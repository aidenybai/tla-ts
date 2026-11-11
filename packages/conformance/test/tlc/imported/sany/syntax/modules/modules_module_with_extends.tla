(*---
description: Module with EXTENDS. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/modules.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE modules_module_with_extends ----
EXTENDS M1, M2, M3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file modules_module_with_extends
    | In module modules_module_with_extends
    | Cannot find source file for module M1 imported in module modules_module_with_extends.
    | *** Errors: 1
    | In module modules_module_with_extends
    | Cannot find source file for module M1 imported in module modules_module_with_extends.
    3002:1 Parsing or semantic analysis failed.
---*)
