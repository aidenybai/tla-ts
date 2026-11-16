(*---
description: Evaluates a random seq expression, seed 262, number 9217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(({TRUE, 3} \subseteq ({2, 1, 3} \cap {1})), CASE (\A b14304 \in Nat : FALSE) -> (CHOOSE b14305 \in 1..3 : <<5, 6>>) [] OTHER -> (SUBSET {1} % 2), IF (TRUE => FALSE) THEN (CHOOSE b14306 \in 1..3 : TRUE) ELSE (CHOOSE b14307 \in 1..3 : TRUE)) \o <<((2 \div 1) - ((1 :> 2))[2]), ((0 - 2147483647) + (<<5, 6>>)[0])>>))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 153 to line 14, col 158 of module random_09217 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 160.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | Case Other Arm starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_09217
    | In module random_09217
    | Could not parse module random_09217 from file random_09217.tla
    | *** Errors: 1
    | In module random_09217
    | Could not parse module random_09217 from file random_09217.tla
    3002:1 Parsing or semantic analysis failed.
---*)
