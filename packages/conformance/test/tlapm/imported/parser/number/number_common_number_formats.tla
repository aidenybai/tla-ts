(*---
description: The syntax corpus case "Common Number Formats" in number.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/number.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE number_common_number_formats ----
op1 == 12345
op2 == 12345.12345
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
