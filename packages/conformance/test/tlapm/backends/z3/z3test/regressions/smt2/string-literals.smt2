(*---
description: z3test's regression regressions/smt2/string-literals.smt2.
ref: regressions/smt2/string-literals.smt2
features:
  - z3test
outcome: any
---*)
(echo "this is a string literal")
(echo "")
(echo "She said: ""Bye bye"" and left.")
(echo "this is a string literal

with a line break in it"
)

(*--- recorded
all:
  exit: 0
  transcript: |-
    this is a string literal

    She said: "Bye bye" and left.
    this is a string literal

    with a line break in it
---*)
