(*---
description: The syntax corpus case "Label not interfering with precedence" in labels.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/labels.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE labels_label_not_interfering_with_precedence ----
EXTENDS TestPrelude
op == a + lab :: b * c
====
---- MODULE TestPrelude ----
VARIABLES a, b, c
CONSTANTS _ + _, _ * _
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./labels_label_not_interfering_with_precedence.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./labels_label_not_interfering_with_precedence.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
