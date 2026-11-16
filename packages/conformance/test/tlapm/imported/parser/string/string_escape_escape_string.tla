(*---
description: The syntax corpus case "Escape Escape String" in string.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/string.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE string_escape_escape_string ----
op == <<"/\\", "\\/">>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
