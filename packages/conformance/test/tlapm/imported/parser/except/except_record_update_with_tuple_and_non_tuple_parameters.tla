(*---
description: The syntax corpus case "Record Update with Tuple and Non-Tuple Parameters" in except.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/except.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE except_record_update_with_tuple_and_non_tuple_parameters ----
EXTENDS TestPrelude
r == [f EXCEPT ![<<1, 1>>, 1] = 0]
====
---- MODULE TestPrelude ----
VARIABLE f
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./except_record_update_with_tuple_and_non_tuple_parameters.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./except_record_update_with_tuple_and_non_tuple_parameters.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
