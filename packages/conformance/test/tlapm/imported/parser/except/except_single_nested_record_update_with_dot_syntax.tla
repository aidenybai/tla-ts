(*---
description: The syntax corpus case "Single nested record update with dot syntax" in except.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/except.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE except_single_nested_record_update_with_dot_syntax ----
EXTENDS TestPrelude
r == [a EXCEPT !.x.y.z = "b"]
====
---- MODULE TestPrelude ----
VARIABLE a
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./except_single_nested_record_update_with_dot_syntax.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./except_single_nested_record_update_with_dot_syntax.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
