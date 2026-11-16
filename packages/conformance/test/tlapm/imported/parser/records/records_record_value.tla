(*---
description: The syntax corpus case "Record Value" in records.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/records.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE records_record_value ----
EXTENDS TestPrelude
op == foo.bar
====
---- MODULE TestPrelude ----
foo == [ bar : 0 ]
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./records_record_value.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./records_record_value.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
