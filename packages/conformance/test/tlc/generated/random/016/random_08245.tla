(*---
description: Evaluates a random record expression, seed 262, number 8245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [b12759 \in {1} |-> b12759] \ (({1} \cup <<1, 2>>) \ (SUBSET {1} \cap {x \in 1..3 : x > 1}))) = {(-IF FALSE THEN 2147483647 ELSE 3), CASE (\A b12760 \in {x \in 1..3 : x > 1} : FALSE) -> (-1 % 2147483647) [] OTHER -> (1 \div -1)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 244 to line 14, col 247 of module random_08245 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 242.
    | Expression starting at line 14, column 242.
    | ExtendableExpr starting at line 14, column 241.
    | Expression starting at line 14, column 241.
    | Case Other Arm starting at line 14, column 232.
    | Fatal errors while parsing TLA+ spec in file random_08245
    | In module random_08245
    | Could not parse module random_08245 from file random_08245.tla
    | *** Errors: 1
    | In module random_08245
    | Could not parse module random_08245 from file random_08245.tla
    3002:1 Parsing or semantic analysis failed.
---*)
