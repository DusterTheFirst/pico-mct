use std::time::Duration;

use async_std::task;
use tide::{sse::Sender, Request, Result};

use crate::State;

pub async fn sse_handler(req: Request<State>, sender: Sender) -> Result<()> {
    loop {
        sender.send("test", req.method(), None).await?;
        task::sleep(Duration::from_secs(1)).await;
    }
}
