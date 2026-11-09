---- MODULE CaseArms ----
EXTENDS Naturals
VARIABLES x, mode
Init == x = 0 /\ mode = "low"
Next ==
  CASE x < 2 ->
         /\ x' = x + 1
         /\ mode' = CASE x = 0 -> "low" [] x < 3 -> "mid" [] OTHER -> "high"
    [] x < 4 ->
         \/ x' = x + 3 /\ mode' = "mid"
         \/ x' = x + 1 /\ mode' = "high"
         \/ x' = 0 /\ mode' = "low"
    [] OTHER -> x' = x - 1 /\ mode' = CASE mode = "mid" -> "high" [] OTHER -> mode
====
