(*---
description: The syntax corpus case "INSTANCE With Operator Substitutions" in unit.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/unit.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE unit_instance_with_operator_substitutions ----
EXTENDS TestPrelude
INSTANCE M WITH
  A <- a,
  * <- c
====
---- MODULE M ----
VARIABLE A
CONSTANT _ * _
====
---- MODULE TestPrelude ----
a == 0
c(x, y) == << x, y >>
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unit_instance_with_operator_substitutions.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    Unknown module "M"

    File "./unit_instance_with_operator_substitutions.tla", line 12, character 1 to line 14, character 8:
    Error: Unknown module "M"
    File "./unit_instance_with_operator_substitutions.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
