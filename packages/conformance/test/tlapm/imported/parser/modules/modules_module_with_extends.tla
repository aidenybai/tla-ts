(*---
description: The syntax corpus case "Module with EXTENDS" in modules.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/modules.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE modules_module_with_extends ----
EXTENDS M1, M2, M3
====
---- MODULE M1 ----
====
---- MODULE M2 ----
====
---- MODULE M3 ----
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./modules_module_with_extends.tla", line 11, characters 17-18

    Unknown module "M3"

    Unknown module "M2"

    Unknown module "M1"

    File "./modules_module_with_extends.tla", line 11, characters 9-10:
    Error: Unknown module "M1"
    File "./modules_module_with_extends.tla", line 11, characters 13-14:
    Error: Unknown module "M2"
    File "./modules_module_with_extends.tla", line 11, characters 17-18:
    Error: Unknown module "M3"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
