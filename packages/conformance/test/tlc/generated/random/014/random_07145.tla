(*---
description: Evaluates a random int expression, seed 262, number 7145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((\E b10973 \in ({1, 2} \ {x \in 1..3 : x > 1}) : IF FALSE THEN TRUE ELSE 0) /\ ((1..3 \cup {1}) = (2..1 \cap 1..3))) THEN (LET b10974 == IF FALSE THEN [a |-> 1, b |-> TRUE] ELSE 0 IN (-1 \div -1) - LET b10975 == Head([a |-> 1]) IN (7 * 2)) ELSE CASE (UNION {1..3, 1..3} \subseteq (7 .. 7)) -> (-IF FALSE THEN 2 ELSE 1) [] OTHER -> (CHOOSE b10976 \in {b10977 \in 1..3 : TRUE} : (FALSE <=> FALSE)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 207 to line 14, col 210 of module random_07145 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 205.
    | Expression starting at line 14, column 204.
    | ExtendableExpr starting at line 14, column 203.
    | Expression starting at line 14, column 203.
    | Case Other Arm starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_07145
    | In module random_07145
    | Could not parse module random_07145 from file random_07145.tla
    | *** Errors: 1
    | In module random_07145
    | Could not parse module random_07145 from file random_07145.tla
    3002:1 Parsing or semantic analysis failed.
---*)
