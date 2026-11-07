(*---
description: The syntax corpus case "Basic Operator Definition" in unit.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/unit.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE unit_basic_operator_definition ----
EXTENDS TestPrelude
op == f(10)
====
---- MODULE TestPrelude ----
f(x) == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unit_basic_operator_definition.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./unit_basic_operator_definition.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
