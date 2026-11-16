---- MODULE EmptyResponses ----
EXTENDS Naturals, FiniteSets
CONSTANTS Txns
VARIABLES response
HasResponse(r) == Cardinality(DOMAIN r) # 0
Init == response = [t \in Txns |-> <<>>]
Retry(t) ==
  /\ HasResponse(response[t])
  /\ response[t]["rsp"] # "ok"
  /\ response' = [response EXCEPT ![t] = <<>>]
Reply(t) ==
  /\ ~HasResponse(response[t])
  /\ \E found \in BOOLEAN :
       response' = [response EXCEPT ![t] = [rsp |-> IF found THEN "ok" ELSE "stale", found |-> found]]
Next == \E t \in Txns : Retry(t) \/ Reply(t)
Found == \A t \in Txns : HasResponse(response[t]) => ((response[t]["rsp"] = "ok") = response[t]["found"])
====
