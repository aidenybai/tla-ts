(*---
description: The syntax corpus case "Basic record update" in except.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/except.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE except_basic_record_update ----
EXTENDS TestPrelude
r == [a EXCEPT ![2] = "a"]
====
---- MODULE TestPrelude ----
VARIABLE a
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./except_basic_record_update.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./except_basic_record_update.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
