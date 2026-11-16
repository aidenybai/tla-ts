(*---
description: The syntax corpus case "Record Update with Single-Value Tuple Parameter" in except.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/except.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE except_record_update_with_single_value_tuple_parameter ----
EXTENDS TestPrelude
r == [f EXCEPT ![<<1>>] = 0]
====
---- MODULE TestPrelude ----
VARIABLE f
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./except_record_update_with_single_value_tuple_parameter.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./except_record_update_with_single_value_tuple_parameter.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
