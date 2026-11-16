(*---
description: The syntax corpus case "Basic String" in string.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/string.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE string_basic_string ----
op == "Hello, world!"
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
