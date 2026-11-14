(*---
description: The syntax corpus case "Record Value Inside Jlist" in records.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/records.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE records_record_value_inside_jlist ----
EXTENDS TestPrelude
op ==
  /\ 1
  /\ foo.bar 

====
---- MODULE TestPrelude ----
foo == [ bar : 0 ]
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./records_record_value_inside_jlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./records_record_value_inside_jlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
