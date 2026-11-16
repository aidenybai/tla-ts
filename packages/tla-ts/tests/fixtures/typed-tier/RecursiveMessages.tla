---- MODULE RecursiveMessages ----
EXTENDS Naturals
CONSTANTS Server, None
VARIABLES msgs, pending, count
Init == msgs = {} /\ pending = [s \in Server |-> None] /\ count = 0
Request(s, t) ==
  LET m == [type |-> "req", src |-> s, dst |-> t, n |-> count]
  IN /\ count < 2
     /\ pending[s] = None
     /\ msgs' = msgs \cup {m}
     /\ pending' = [pending EXCEPT ![s] = m]
     /\ count' = count + 1
Respond(m) ==
  /\ m.type = "req"
  /\ msgs' = (msgs \ {m}) \cup {[type |-> "resp", src |-> m.dst, dst |-> m.src, correlation |-> m]}
  /\ UNCHANGED <<pending, count>>
Forward(m) ==
  /\ m.type = "resp"
  /\ m.correlation.n = 0
  /\ msgs' = (msgs \ {m}) \cup {[type |-> "fwd", src |-> m.src, dst |-> m.dst, correlation |-> m]}
  /\ UNCHANGED <<pending, count>>
Receive(m) ==
  /\ m.type # "req"
  /\ LET request == IF m.type = "resp" THEN m.correlation ELSE m.correlation.correlation
     IN /\ pending[m.dst] = request
        /\ msgs' = msgs \ {m}
        /\ pending' = [pending EXCEPT ![m.dst] = None]
        /\ UNCHANGED count
Next ==
  \/ \E s, t \in Server : s # t /\ Request(s, t)
  \/ \E m \in msgs : Respond(m) \/ Forward(m) \/ Receive(m)
Delivered == \A m \in msgs : m.type = "fwd" => m.correlation.correlation.type = "req"
====
