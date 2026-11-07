(*---
description: The syntax corpus case "Definition After Nested Module" in modules.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/modules.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE modules_definition_after_nested_module ----
EXTENDS TestPrelude
---- MODULE Inner ----
====
op == x
====
---- MODULE TestPrelude ----
VARIABLE x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./modules_definition_after_nested_module.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./modules_definition_after_nested_module.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
