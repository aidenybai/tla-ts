(*---
description: The syntax corpus case "INSTANCE With Jlist Substitutions" in unit.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/unit.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE unit_instance_with_jlist_substitutions ----
INSTANCE M WITH
  A <- /\ 1,
  B <- /\ 2,
  C <- /\ \/ 3
          \/ 4,
  D <- \/ 5
====
---- MODULE M ----
VARIABLES A, B, C, D
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unit_instance_with_jlist_substitutions.tla", line 11, character 1 to line 16, character 11

    Unknown module "M"

    File "./unit_instance_with_jlist_substitutions.tla", line 11, character 1 to line 16, character 11:
    Error: Unknown module "M"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
